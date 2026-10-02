import { describe, expect, it } from "bun:test";
import {
  initContentWatcher,
  subscribeToContentChanges,
} from "../content-watcher";

describe("Content Hot Reload Watcher", () => {
  it("initializes singleton state and registers listeners", () => {
    let triggered = false;
    const unsubscribe = subscribeToContentChanges((_data) => {
      triggered = true;
    });

    const state = initContentWatcher();
    expect(state).not.toBeNull();
    expect(state?.initialized).toBe(true);
    expect(triggered).toBe(false);

    unsubscribe();
  });
});
