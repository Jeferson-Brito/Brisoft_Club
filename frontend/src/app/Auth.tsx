import { useState } from "react";
import { api } from "./state";
export function Auth({
  initialized,
  onSuccess,
}: {
  initialized: boolean;
  onSuccess: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="auth">
      <section className="auth-brand">
        <span className="brand-star">☆</span>
        <h1>
          CLUBE DE
          <br />
          TALENTOS
        </h1>
        <p>Pessoas que fazem a diferença.</p>
        <div>
          Reconheça o talento.
          <br />
          Acompanhe a evolução.
          <br />
          Construa grandes resultados.
        </div>
      </section>
      <section className="auth-form">
        <div className="eyebrow">BEM-VINDO AO CLUBE</div>
        <h2>{initialized ? "Acesse sua conta" : "Configure sua empresa"}</h2>
        <p>
          {initialized
            ? "Entre para acompanhar avaliações e conquistas."
            : "Crie o primeiro administrador. Os dados ficarão salvos neste computador."}
        </p>
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
                      demo: f.get("demo") === "on",
                    },
              );
              onSuccess();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {!initialized && (
            <>
              <label>
                Empresa
                <input name="company" required minLength={2} maxLength={120} />
              </label>
              <label>
                Seu nome
                <input name="name" required minLength={2} maxLength={100} />
              </label>
            </>
          )}
          <label>
            E-mail
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Senha
            <input
              name="password"
              type="password"
              autoComplete={initialized ? "current-password" : "new-password"}
              minLength={initialized ? 1 : 10}
              maxLength={128}
              required
            />
          </label>
          {!initialized && (
            <>
              <small>Use ao menos 10 caracteres.</small>
              <label className="inline-check">
                <input name="demo" type="checkbox" /> Incluir seis colaboradores
                de demonstração
              </label>
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="btn" disabled={busy}>
            {busy
              ? "Aguarde…"
              : initialized
                ? "Entrar"
                : "Criar empresa e começar"}
          </button>
        </form>
        <small>
          {initialized
            ? "Precisa de acesso? Solicite uma conta ao administrador da empresa."
            : "As regras de pontuação poderão ser definidas nas Configurações."}
        </small>
      </section>
    </main>
  );
}
