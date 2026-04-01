import MockAdapter from "axios-mock-adapter";
import { apiClient, appendAuthToken } from "@/lib/api/client";
import { getToken, setToken } from "@/lib/auth/token-storage";

describe("api client", () => {
  it("appends bearer token via request helper", () => {
    const config = appendAuthToken(
      {
        headers: {},
      } as never,
      "token-1",
    );

    expect(config.headers.Authorization).toBe("Bearer token-1");
  });

  it("clears session on unauthorized response", async () => {
    const mock = new MockAdapter(apiClient);
    setToken("active");
    mock.onGet("/protected").reply(401, { message: "Unauthorized" });

    await expect(apiClient.get("/protected")).rejects.toBeTruthy();

    expect(getToken()).toBeNull();
    mock.restore();
  });
});
