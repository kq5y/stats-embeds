type AssetBinding = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

type Env = {
  Bindings: {
    ASSETS: AssetBinding;
  };
};
