import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowRight, Star, TrendingUp, Trophy } from "lucide-react";
import { api } from "./state";

// ── Corner Stripes ──
// Corporate 45° tri-color stripes from marketing mockup:
// Innermost: Gold (#f5b300) | Middle: Crimson Red (#c8102e) | Outer Corner: Deep Navy (#071e4d)

function CornerStripesBottomLeft({ size = 200, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`pointer-events-none select-none absolute bottom-0 left-0 z-10 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Navy Corner Triangle */}
      <polygon points="0,200 0,135 135,200" fill="#071e4d" />
      {/* Middle Crimson Red Stripe */}
      <polygon points="0,135 0,90 90,200 135,200" fill="#c8102e" />
      {/* Inner Golden Yellow Stripe */}
      <polygon points="0,90 0,58 58,200 90,200" fill="#f5b300" />
    </svg>
  );
}

function CornerStripesTopRight({ size = 200, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`pointer-events-none select-none absolute top-0 right-0 z-10 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Navy Corner Triangle */}
      <polygon points="200,0 135,0 200,135" fill="#071e4d" />
      {/* Middle Crimson Red Stripe */}
      <polygon points="135,0 90,0 200,90 200,135" fill="#c8102e" />
      {/* Inner Golden Yellow Stripe */}
      <polygon points="90,0 58,0 200,58 200,90" fill="#f5b300" />
    </svg>
  );
}

function CornerStripesTopLeft({ size = 150, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`pointer-events-none select-none absolute top-0 left-0 z-10 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      viewBox="0 0 150 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon points="0,0 100,0 0,100" fill="#051538" />
      <polygon points="100,0 130,0 0,130 0,100" fill="#c8102e" />
      <polygon points="130,0 150,0 0,150 0,130" fill="#f5b300" />
    </svg>
  );
}

// ── Left Panel Subtle Heraldic Shield Watermark (Desktop) ──
function ShieldWatermark() {
  return (
    <svg
      className="pointer-events-none select-none w-full h-full"
      viewBox="0 0 500 620"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M250,40 L440,110 C440,360 375,510 250,590 C125,510 60,360 60,110 Z"
        stroke="rgba(255, 255, 255, 0.04)"
        strokeWidth="12"
        strokeLinejoin="round"
      />
      <path
        d="M250,65 L415,128 C415,342 355,480 250,555 C145,480 85,342 85,128 Z"
        stroke="rgba(255, 255, 255, 0.03)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* Laurel Leaves Left */}
      <path
        d="M145,430 C105,350 105,230 185,150"
        stroke="rgba(255, 255, 255, 0.04)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M145,410 C118,395 110,362 124,338 C138,362 143,390 145,410 Z" fill="rgba(255, 255, 255, 0.03)" />
      <path d="M126,370 C98,350 94,318 112,295 C124,318 126,346 126,370 Z" fill="rgba(255, 255, 255, 0.03)" />
      <path d="M116,322 C92,298 92,266 116,246 C123,270 121,298 116,322 Z" fill="rgba(255, 255, 255, 0.03)" />
      <path d="M121,268 C102,240 106,206 135,192 C137,216 130,244 121,268 Z" fill="rgba(255, 255, 255, 0.03)" />
      <path d="M146,215 C132,186 146,158 174,148 C169,172 158,196 146,215 Z" fill="rgba(255, 255, 255, 0.03)" />

      {/* Laurel Leaves Right */}
      <path
        d="M355,430 C395,350 395,230 315,150"
        stroke="rgba(255, 255, 255, 0.04)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M355,410 C382,395 390,362 376,338 C362,362 357,390 355,410 Z" fill="rgba(255, 255, 255, 0.03)" />
      <path d="M374,370 C402,350 406,318 388,295 C376,318 374,346 374,370 Z" fill="rgba(255, 255, 255, 0.03)" />
      <path d="M384,322 C408,298 408,266 384,246 C377,270 379,298 384,322 Z" fill="rgba(255, 255, 255, 0.03)" />
      <path d="M379,268 C398,240 394,206 365,192 C363,216 370,244 379,268 Z" fill="rgba(255, 255, 255, 0.03)" />
      <path d="M354,215 C368,186 354,158 326,148 C331,172 342,196 354,215 Z" fill="rgba(255, 255, 255, 0.03)" />
    </svg>
  );
}

// ── Mobile Header Laurel Watermark (Right side) ──
function MobileHeaderWatermark() {
  return (
    <svg
      className="pointer-events-none select-none w-full h-full"
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M170,220 C185,160 180,90 120,40"
        stroke="rgba(255, 255, 255, 0.07)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M172,200 C190,190 195,165 180,148 C170,165 168,185 172,200 Z" fill="rgba(255, 255, 255, 0.07)" />
      <path d="M178,160 C198,145 200,120 185,102 C175,120 174,142 178,160 Z" fill="rgba(255, 255, 255, 0.07)" />
      <path d="M170,120 C188,102 186,75 168,60 C162,78 165,100 170,120 Z" fill="rgba(255, 255, 255, 0.07)" />
      <path d="M148,80 C162,60 156,36 135,26 C134,44 140,64 148,80 Z" fill="rgba(255, 255, 255, 0.07)" />
    </svg>
  );
}

// ── Right / Bottom Panel Soft Laurel Watermark ──
function LaurelBranchWatermark() {
  return (
    <svg
      className="pointer-events-none select-none absolute bottom-0 right-0"
      style={{ width: "240px", height: "420px", opacity: 0.5 }}
      viewBox="0 0 300 500"
      fill="#cbd5e1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M60,480 C120,380 180,260 220,100"
        stroke="#cbd5e1"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M70,440 C110,430 135,405 125,380 C100,395 85,420 70,440 Z" />
      <path d="M50,420 C15,405 0,380 5,355 C30,370 45,395 50,420 Z" />
      <path d="M95,370 C140,350 165,320 155,290 C125,310 105,345 95,370 Z" />
      <path d="M70,340 C30,320 10,290 18,262 C45,280 62,315 70,340 Z" />
      <path d="M125,295 C175,270 205,235 192,202 C160,225 138,265 125,295 Z" />
      <path d="M90,260 C45,235 22,200 32,170 C62,192 82,230 90,260 Z" />
      <path d="M160,215 C215,185 245,145 230,110 C195,135 172,180 160,215 Z" />
      <path d="M120,175 C70,145 42,105 55,75 C88,100 110,142 120,175 Z" />
      <path d="M195,125 C250,90 275,45 255,10 C222,40 202,90 195,125 Z" />
      <path d="M150,85 C100,52 75,12 90,-18 C120,5 142,50 150,85 Z" />
    </svg>
  );
}

export function Auth({
  initialized,
  onSuccess,
}: {
  initialized: boolean;
  onSuccess: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        fontFamily: "'Montserrat', 'Segoe UI', Roboto, sans-serif",
      }}
      className="flex flex-col lg:grid lg:grid-cols-2 bg-white relative overflow-x-hidden"
    >
      {/* ─────────────────────────────────────────────────────────────
         DESKTOP LEFT PANEL (Dark Corporate Navy)
      ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#071e4d",
          color: "#ffffff",
        }}
        className="hidden lg:flex relative flex-col justify-center px-12 xl:px-24 py-16 overflow-hidden select-none"
      >
        {/* Pinned Bottom-Left Corner Stripes */}
        <CornerStripesBottomLeft size={200} />

        {/* Heraldic Shield Watermark (large subtle texture right-aligned) */}
        <div
          className="absolute pointer-events-none"
          style={{
            right: "-20px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "560px",
            height: "680px",
          }}
        >
          <ShieldWatermark />
        </div>

        {/* Brand & Proposition Content */}
        <div className="relative z-20 max-w-[420px] w-full mx-auto" style={{ paddingLeft: "10px" }}>
          {/* Logo */}
          <div style={{ marginBottom: "28px" }}>
            <img
              src="/logo/Logo_Club_Talentos_Transparente.png"
              alt="Clube de Talentos"
              style={{
                width: "135px",
                height: "135px",
                filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.5))",
              }}
              className="object-contain"
            />
          </div>

          {/* Title & Slogan */}
          <div style={{ marginBottom: "36px" }}>
            <div
              style={{
                color: "#ffffff",
                fontSize: "40px",
                fontWeight: 900,
                lineHeight: "1.0",
                letterSpacing: "-0.01em",
                textTransform: "uppercase",
              }}
            >
              CLUBE DE
            </div>
            <div
              style={{
                color: "#f5b300",
                fontSize: "40px",
                fontWeight: 900,
                lineHeight: "1.0",
                letterSpacing: "-0.01em",
                textTransform: "uppercase",
                marginTop: "6px",
              }}
            >
              TALENTOS
            </div>
            <p
              style={{
                color: "#94a3b8",
                fontSize: "14px",
                fontWeight: 400,
                marginTop: "12px",
                letterSpacing: "0.01em",
              }}
            >
              Pessoas que fazem a diferença.
            </p>
          </div>

          {/* 3 Value Propositions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* 1. Reconheça */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Star size={22} style={{ color: "#f5b300", fill: "#f5b300", flexShrink: 0 }} />
              <div>
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px", lineHeight: "1.2" }}>
                  Reconheça
                </div>
                <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: "1.2" }}>
                  o talento.
                </div>
              </div>
            </div>

            {/* 2. Acompanhe */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <TrendingUp size={22} style={{ color: "#f5b300", strokeWidth: 2.5, flexShrink: 0 }} />
              <div>
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px", lineHeight: "1.2" }}>
                  Acompanhe
                </div>
                <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: "1.2" }}>
                  a evolução.
                </div>
              </div>
            </div>

            {/* 3. Construa */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Trophy size={22} style={{ color: "#f5b300", strokeWidth: 2, flexShrink: 0 }} />
              <div>
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px", lineHeight: "1.2" }}>
                  Construa
                </div>
                <div style={{ color: "#94a3b8", fontSize: "12px", lineHeight: "1.2" }}>
                  grandes resultados.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
         MOBILE TOP HEADER (Curved Navy Banner with Gold Arc Accent)
      ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "#071e4d",
          color: "#ffffff",
          position: "relative",
          paddingTop: "36px",
          paddingBottom: "40px",
          overflow: "hidden",
        }}
        className="lg:hidden select-none"
      >
        {/* Top-Left Corner Stripes */}
        <CornerStripesTopLeft size={130} />

        {/* Subtle Right Laurel Watermark in Navy Header */}
        <div
          className="absolute right-0 top-0 bottom-0 pointer-events-none"
          style={{ width: "160px", height: "100%" }}
        >
          <MobileHeaderWatermark />
        </div>

        {/* Mobile Brand Lockup: Logo + Gold Divider + Text */}
        <div
          className="relative z-20 flex items-center justify-center gap-3.5 px-6 max-w-sm mx-auto"
          style={{ marginTop: "2px" }}
        >
          <img
            src="/logo/Logo_Club_Talentos_Transparente.png"
            alt="Clube de Talentos"
            style={{ width: "72px", height: "72px", filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.45))" }}
            className="object-contain flex-shrink-0"
          />

          {/* Thin Gold Divider */}
          <div
            style={{
              width: "2px",
              height: "54px",
              background: "#f5b300",
              flexShrink: 0,
              borderRadius: "1px",
              opacity: 0.85,
            }}
          />

          {/* Brand Text */}
          <div className="min-w-0 flex-1">
            <div
              style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "#ffffff",
                textTransform: "uppercase",
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
              }}
            >
              CLUBE DE
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "#f5b300",
                textTransform: "uppercase",
                lineHeight: 1.05,
                marginTop: "3px",
                letterSpacing: "-0.01em",
              }}
            >
              TALENTOS
            </div>
            <p
              style={{
                color: "#cbd5e1",
                fontSize: "11px",
                marginTop: "4px",
                lineHeight: 1.2,
                fontWeight: 400,
              }}
            >
              Pessoas que fazem a diferença.
            </p>
          </div>
        </div>

        {/* Sweeping Bottom Curve with Golden Accent Stroke */}
        <div
          className="absolute -bottom-1 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none"
          style={{ height: "36px" }}
        >
          <svg
            className="w-full h-full block"
            viewBox="0 0 400 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            {/* White bottom fill creating the arch */}
            <path
              d="M0,20 Q200,38 400,20 L400,36 L0,36 Z"
              fill="#ffffff"
            />
            {/* Golden Yellow Accent Arc Line */}
            <path
              d="M0,20 Q200,38 400,20"
              stroke="#f5b300"
              strokeWidth="4"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
         RIGHT / MAIN FORM PANEL (Clean White)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 relative flex flex-col justify-start lg:justify-center bg-white px-6 pt-9 pb-12 sm:px-12 sm:pt-8 lg:py-16 xl:p-24 overflow-hidden">
        {/* Desktop Top-Right Corner Stripes */}
        <div className="hidden lg:block">
          <CornerStripesTopRight size={200} />
        </div>

        {/* Mobile & Desktop Bottom-Left Corner Stripes */}
        <CornerStripesBottomLeft size={160} className="lg:hidden" />

        {/* Subtle Climbing Laurel Watermark in Bottom-Right */}
        <LaurelBranchWatermark />

        {/* Form Container */}
        <div
          style={{
            maxWidth: "420px",
            width: "100%",
            margin: "0 auto",
            position: "relative",
            zIndex: 20,
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "#071d49",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            BEM-VINDO AO CLUBE
          </div>

          {/* Title: Acesse sua conta */}
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 34px)",
              color: "#071d49",
              letterSpacing: "-0.02em",
              lineHeight: "1.15",
              marginBottom: "6px",
              fontWeight: 400,
            }}
          >
            {initialized ? (
              <>
                Acesse <strong style={{ fontWeight: 800 }}>sua conta</strong>
              </>
            ) : (
              <>
                Configure <strong style={{ fontWeight: 800 }}>sua empresa</strong>
              </>
            )}
          </h2>

          {/* Subtitle */}
          <p
            style={{
              color: "#64748b",
              fontSize: "13px",
              fontWeight: 400,
              marginBottom: "24px",
            }}
          >
            {initialized
              ? "Entre para acompanhar avaliações e conquistas."
              : "Crie o primeiro administrador do sistema."}
          </p>

          {/* Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              setBusy(true);
              setError("");
              try {
                await api(
                  initialized ? "/auth/login" : "/auth/setup",
                  initialized
                    ? { email: f.get("email"), password: f.get("password") }
                    : {
                        company: f.get("company"),
                        name: f.get("name"),
                        email: f.get("email"),
                        password: f.get("password"),
                      },
                );
                onSuccess();
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {!initialized && (
              <>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#475569",
                      marginBottom: "6px",
                      marginLeft: "2px",
                    }}
                  >
                    Empresa
                  </label>
                  <div
                    style={{
                      background: "#f1f5fa",
                      border: "1px solid #dce4f0",
                      borderRadius: "12px",
                      height: "48px",
                      padding: "0 16px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      name="company"
                      required
                      minLength={2}
                      maxLength={120}
                      placeholder="Nome da sua empresa"
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: "14px",
                        color: "#0f172a",
                        fontWeight: 500,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#475569",
                      marginBottom: "6px",
                      marginLeft: "2px",
                    }}
                  >
                    Seu nome
                  </label>
                  <div
                    style={{
                      background: "#f1f5fa",
                      border: "1px solid #dce4f0",
                      borderRadius: "12px",
                      height: "48px",
                      padding: "0 16px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <input
                      name="name"
                      required
                      minLength={2}
                      maxLength={100}
                      placeholder="Seu nome completo"
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: "14px",
                        color: "#0f172a",
                        fontWeight: 500,
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#475569",
                  marginBottom: "6px",
                  marginLeft: "2px",
                }}
              >
                E-mail ou login
              </label>
              <div
                style={{
                  background: "#f1f5fa",
                  border: "1px solid #dce4f0",
                  borderRadius: "12px",
                  height: "48px",
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Mail size={18} style={{ color: "#071d49", marginRight: "12px", flexShrink: 0 }} />
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="Digite seu e-mail ou login"
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    color: "#0f172a",
                    fontWeight: 500,
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#475569",
                  marginBottom: "6px",
                  marginLeft: "2px",
                }}
              >
                Senha
              </label>
              <div
                style={{
                  background: "#f1f5fa",
                  border: "1px solid #dce4f0",
                  borderRadius: "12px",
                  height: "48px",
                  padding: "0 16px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Lock size={18} style={{ color: "#071d49", marginRight: "12px", flexShrink: 0 }} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={initialized ? "current-password" : "new-password"}
                  minLength={initialized ? 1 : 10}
                  maxLength={128}
                  required
                  placeholder="Digite sua senha"
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    color: "#0f172a",
                    fontWeight: 500,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label={showPassword ? "Ocultar senha" : "Visualizar senha"}
                  title={showPassword ? "Ocultar senha" : "Visualizar senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div style={{ paddingTop: "4px" }}>
              <button
                type="submit"
                disabled={busy}
                style={{
                  background: "#071d49",
                  borderRadius: "12px",
                  height: "48px",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "0 20px",
                  cursor: busy ? "not-allowed" : "pointer",
                  border: "none",
                  boxShadow: "0 4px 14px rgba(7, 29, 73, 0.25)",
                  transition: "all 0.2s",
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <LogIn size={18} style={{ color: "#ffffff" }} />
                <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "15px" }}>
                  {busy ? "Entrando…" : initialized ? "Entrar" : "Criar empresa e começar"}
                </span>
                <ArrowRight size={18} style={{ color: "#ffffff", marginLeft: "2px" }} />
              </button>
            </div>
          </form>

          {/* Footer Notice */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              marginTop: "20px",
            }}
          >
            <Lock size={14} style={{ color: "#071d49", flexShrink: 0, marginTop: "2px" }} />
            <span style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.4 }}>
              {initialized
                ? "Precisa de acesso? Solicite uma conta ao administrador da empresa."
                : "As regras de pontuação poderão ser definidas nas Configurações."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
