import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  type WASocket,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

export interface WhatsAppStatus {
  status: "disconnected" | "connecting" | "connected";
  connectedUser: string | null;
  qrCode: string | null;
  lastError: string | null;
  autoNotifications: boolean;
}

export interface SendLog {
  id: string;
  recipientName: string;
  phone: string;
  messageType: string;
  status: "sent" | "failed";
  error?: string;
  sentAt: string;
}

export class WhatsAppService {
  private sock: WASocket | null = null;
  private status: "disconnected" | "connecting" | "connected" = "disconnected";
  private connectedUser: string | null = null;
  private qrCode: string | null = null;
  private lastError: string | null = null;
  private authDir: string;
  private logs: SendLog[] = [];
  public autoNotifications = true;
  private isConnecting = false;

  constructor(authDir?: string) {
    this.authDir = authDir || resolve(process.cwd(), "data/whatsapp-auth");
  }

  public getStatus(): WhatsAppStatus {
    return {
      status: this.status,
      connectedUser: this.connectedUser,
      qrCode: this.qrCode,
      lastError: this.lastError,
      autoNotifications: this.autoNotifications,
    };
  }

  public getLogs(): SendLog[] {
    return [...this.logs];
  }

  public async initSession(): Promise<void> {
    if (this.status === "connected" || this.isConnecting) return;
    this.isConnecting = true;
    this.status = "connecting";
    this.lastError = null;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);

      const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }) as any,
        printQRInTerminal: false,
        browser: ["Clube de Talentos", "Chrome", "1.0.0"],
        syncFullHistory: false,
      });

      this.sock = sock;

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            this.qrCode = await QRCode.toDataURL(qr, {
              margin: 2,
              width: 320,
              color: { dark: "#071e4d", light: "#ffffff" },
            });
            this.status = "connecting";
          } catch (err: any) {
            console.error("Erro ao gerar QR Code WhatsApp:", err);
          }
        }

        if (connection === "open") {
          this.status = "connected";
          this.qrCode = null;
          this.lastError = null;
          const userJid = sock.user?.id || "";
          const cleanedNumber = userJid.split(":")[0].replace(/\D/g, "");
          this.connectedUser = cleanedNumber ? `+${cleanedNumber}` : "Conectado";
          console.log(`WhatsApp conectado com sucesso como: ${this.connectedUser}`);
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          const isRestartRequired = statusCode === DisconnectReason.restartRequired || statusCode === 515;
          const shouldReconnect = !isLoggedOut;

          this.sock = null;

          if (isLoggedOut) {
            this.status = "disconnected";
            this.qrCode = null;
            this.connectedUser = null;
            this.lastError = "Sessão desconectada no celular";
            this.cleanAuth();
            console.log("WhatsApp: Sessão desconectada no celular.");
          } else if (shouldReconnect) {
            // Reconexão automática transparente após leitura do QR code (código 515) ou queda de rede
            this.status = "connecting";
            this.qrCode = null;
            this.lastError = null;
            console.log(`WhatsApp: Finalizando pareamento e reconectando (código ${statusCode})...`);
            setTimeout(() => {
              void this.initSession();
            }, isRestartRequired ? 600 : 1800);
          } else {
            this.status = "disconnected";
            this.qrCode = null;
            this.lastError = lastDisconnect?.error?.message || "Conexão interrompida";
            console.log(`WhatsApp desconectado (código ${statusCode}).`);
          }
        }
      });
    } catch (err: any) {
      this.status = "disconnected";
      this.lastError = err.message || "Falha ao inicializar WhatsApp";
      console.error("Erro ao conectar WhatsApp:", err);
    } finally {
      this.isConnecting = false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {});
        this.sock.end(new Error("Desconexão manual"));
      }
    } finally {
      this.sock = null;
      this.status = "disconnected";
      this.connectedUser = null;
      this.qrCode = null;
      this.cleanAuth();
    }
  }

  private cleanAuth(): void {
    try {
      if (existsSync(this.authDir)) {
        rmSync(this.authDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.warn("Não foi possível apagar pasta de sessão:", err);
    }
  }

  public cleanPhoneNumber(phone: string): string | null {
    if (!phone) return null;
    let digits = phone.replace(/\D/g, "");
    if (!digits) return null;

    // Se começou com 0, remove
    if (digits.startsWith("0")) digits = digits.slice(1);

    // Se tem DDD e número sem DDI (ex: 11999998888 ou 1188887777)
    if (digits.length === 10 || digits.length === 11) {
      digits = `55${digits}`;
    }

    // Valida se tem DDI 55 + DDD (2 dígitos) + 8 ou 9 dígitos
    if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
      return digits;
    }

    return digits.length >= 10 ? digits : null;
  }

  public async sendMessage(
    phone: string,
    message: string,
    recipientName = "Cliente",
    messageType = "notificacao",
  ): Promise<{ success: boolean; error?: string }> {
    const cleaned = this.cleanPhoneNumber(phone);
    if (!cleaned) {
      const err = `Número de telefone inválido: "${phone}"`;
      this.addLog(recipientName, phone, messageType, "failed", err);
      return { success: false, error: err };
    }

    if (this.status !== "connected" || !this.sock) {
      const err = "WhatsApp não está conectado no momento.";
      this.addLog(recipientName, phone, messageType, "failed", err);
      return { success: false, error: err };
    }

    try {
      const jid = `${cleaned}@s.whatsapp.net`;
      await this.sock.sendMessage(jid, { text: message.trim() });
      this.addLog(recipientName, phone, messageType, "sent");
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || "Erro desconhecido ao enviar mensagem";
      this.addLog(recipientName, phone, messageType, "failed", errMsg);
      return { success: false, error: errMsg };
    }
  }

  private addLog(
    recipientName: string,
    phone: string,
    messageType: string,
    status: "sent" | "failed",
    error?: string,
  ): void {
    this.logs.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      recipientName,
      phone,
      messageType,
      status,
      error,
      sentAt: new Date().toISOString(),
    });

    if (this.logs.length > 100) {
      this.logs.pop();
    }
  }
}

export const whatsappService = new WhatsAppService();
