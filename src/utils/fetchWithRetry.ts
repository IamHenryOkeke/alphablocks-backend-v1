export default async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxAttempts = 3,
  delayMs = 1000,
): Promise<Response> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;

      console.warn(
        `Attempt ${attempt} failed: ${res.status} ${res.statusText}`,
      );
    } catch (err) {
      console.warn(`Attempt ${attempt} threw error:`, err);
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`Failed to fetch ${url} after ${maxAttempts} attempts`);
}
