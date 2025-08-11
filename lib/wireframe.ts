export function isWireframeEnabled(searchParams?: URLSearchParams): boolean {
  if (!searchParams && typeof window !== "undefined") {
    return new URLSearchParams(window.location.search).get("wf") === "1";
  }
  return (searchParams?.get("wf") ?? "") === "1";
}


