import { describe, it, expect, beforeEach } from "vitest";
import RedisMock from "ioredis-mock";
import { CacheClient } from "../src/cache-client.js";

describe("CacheClient", () => {
  let redis: InstanceType<typeof RedisMock>;
  let cache: CacheClient;

  beforeEach(() => {
    redis = new RedisMock();
    cache = new CacheClient(redis as unknown as never);
  });

  it("stores and retrieves objects in a namespace", async () => {
    const user = { id: "u_1", name: "Nasif Kamal" };
    await cache.set("user", "u_1", user);

    const fetched = await cache.get("user", "u_1");
    expect(fetched).toEqual(user);
  });

  it("returns null for non-existent key", async () => {
    const fetched = await cache.get("user", "non_existent");
    expect(fetched).toBeNull();
  });

  it("deletes a key from cache", async () => {
    await cache.set("user", "u_2", { id: "u_2" });
    await cache.del("user", "u_2");

    const fetched = await cache.get("user", "u_2");
    expect(fetched).toBeNull();
  });

  it("invalidates all keys associated with a tag", async () => {
    await cache.set("org", "o_1", { id: "o_1" }, { tags: ["org_group_1"] });
    await cache.set("org", "o_2", { id: "o_2" }, { tags: ["org_group_1"] });
    await cache.set("org", "o_3", { id: "o_3" }, { tags: ["other_group"] });

    await cache.invalidateTag("org_group_1");

    expect(await cache.get("org", "o_1")).toBeNull();
    expect(await cache.get("org", "o_2")).toBeNull();
    expect(await cache.get("org", "o_3")).not.toBeNull();
  });

  it("acquires and releases distributed lock", async () => {
    const lock1 = await cache.acquireLock("payroll_calc", 5);
    expect(lock1.acquired).toBe(true);

    // Second acquire on the same resource should fail
    const lock2 = await cache.acquireLock("payroll_calc", 5);
    expect(lock2.acquired).toBe(false);

    // Release lock1
    const released = await lock1.release();
    expect(released).toBe(true);

    // Now acquire should succeed
    const lock3 = await cache.acquireLock("payroll_calc", 5);
    expect(lock3.acquired).toBe(true);
    await lock3.release();
  });

  it("supports SWR pattern", async () => {
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount++;
      return { configKey: "theme", value: "dark" };
    };

    const first = await cache.swr("config", "theme", fetcher);
    expect(first.value).toBe("dark");
    expect(fetchCount).toBe(1);

    const second = await cache.swr("config", "theme", fetcher);
    expect(second.value).toBe("dark");
    expect(fetchCount).toBe(1); // Cached, fetcher not called again
  });
});
