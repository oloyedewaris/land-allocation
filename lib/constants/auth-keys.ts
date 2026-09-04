const ENV_PREFIX =
  process.env.NEXT_PUBLIC_SERVER_ENV === "development"
    ? "dev"
    : process.env.NEXT_PUBLIC_SERVER_ENV === "staging"
      ? "staging"
      : process.env.NEXT_PUBLIC_SERVER_ENV === "production"
        ? "api"
        : "dev";

export const LOCAL_ESUB_DOMAIN = "graceland-country-view-3244-dev.6787878.com";

export const BaseURL = `https://${ENV_PREFIX}.matadortrust.com/v2`;
