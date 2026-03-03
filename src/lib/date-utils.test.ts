import { todayISO, getWeekStart, formatDate, formatDateLong } from "./date-utils";

describe("todayISO", () => {
  it("should return a YYYY-MM-DD formatted string", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should return the date matching the mocked system time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T10:00:00Z"));
    expect(todayISO()).toBe("2026-06-15");
    vi.useRealTimers();
  });
});

describe("getWeekStart", () => {
  // In the test TZ=UTC, new Date("2026-03-02T00:00:00") is Monday
  it("should return the same Monday for a Monday", () => {
    expect(getWeekStart("2026-03-02")).toBe("2026-03-02");
  });

  it("should return the previous Monday for a Wednesday", () => {
    expect(getWeekStart("2026-03-04")).toBe("2026-03-02");
  });

  it("should return the previous Monday for a Sunday", () => {
    expect(getWeekStart("2026-03-08")).toBe("2026-03-02");
  });

  it("should return the previous Monday for a Saturday", () => {
    expect(getWeekStart("2026-03-07")).toBe("2026-03-02");
  });

  it("should handle month boundary correctly (Sunday Mar 1 → Mon Feb 23)", () => {
    expect(getWeekStart("2026-03-01")).toBe("2026-02-23");
  });

  it("should handle T00:00:00 suffix from the API", () => {
    expect(getWeekStart("2026-03-04T00:00:00")).toBe("2026-03-02");
  });
});

describe("formatDate", () => {
  it("should include the day number", () => {
    expect(formatDate("2026-03-03")).toContain("3");
  });

  it("should include abbreviated weekday", () => {
    // 2026-03-03 is a Tuesday
    expect(formatDate("2026-03-03")).toMatch(/Tue/i);
  });

  it("should include abbreviated month", () => {
    expect(formatDate("2026-03-03")).toMatch(/Mar/i);
  });
});

describe("formatDateLong", () => {
  it("should include the full weekday name", () => {
    // 2026-03-03 is a Tuesday
    expect(formatDateLong("2026-03-03")).toMatch(/Tuesday/i);
  });

  it("should include the day number", () => {
    expect(formatDateLong("2026-03-03")).toContain("3");
  });
});
