import HomeClient from "./home-client";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const prefillValue = params.prefill;
  const initialUrl = Array.isArray(prefillValue)
    ? prefillValue[0] ?? ""
    : prefillValue ?? "";

  return (
    <>
      <HomeClient initialUrl={initialUrl} />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            function setAuditError(message) {
              var error = document.getElementById("url-error");
              if (!(error instanceof HTMLElement)) return;
              error.textContent = message;
              error.style.display = message ? "block" : "none";
            }

            function isAuditHydrated() {
              return window.__landingLensHydrated === true;
            }

            document.addEventListener("click", function (event) {
              if (isAuditHydrated()) return;

              const target = event.target;
              if (!(target instanceof Element)) return;
              const link = target.closest("[data-prefill-url]");
              if (!(link instanceof HTMLAnchorElement)) return;

              event.preventDefault();

              const nextValue = link.getAttribute("data-prefill-url") || "";
              const input = document.getElementById("url-input");
              if (!(input instanceof HTMLInputElement)) return;

              input.value = nextValue;
              input.dispatchEvent(new Event("input", { bubbles: true }));
              setAuditError("");
              input.focus();

              const url = new URL(window.location.href);
              url.searchParams.delete("prefill");
              if (url.hash === "#url-input") {
                url.hash = "";
              }
              window.history.replaceState({}, "", url.toString());
            });
          `,
        }}
      />
    </>
  );
}
