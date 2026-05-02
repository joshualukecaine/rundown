import { todayISO, addDays, getWeekStart, formatDate, formatDateLong } from "./date-utils";

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

describe("addDays", () => {
  it("should add positive days from a given date", () => {
    expect(addDays(7, "2026-05-01")).toBe("2026-05-08");
  });

  it("should subtract days with negative offset", () => {
    expect(addDays(-28, "2026-05-02")).toBe("2026-04-04");
  });

  it("should handle month boundary crossing", () => {
    expect(addDays(5, "2026-03-28")).toBe("2026-04-02");
  });

  it("should default to today when no from date provided", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-02T10:00:00Z"));
    expect(addDays(90)).toBe("2026-07-31");
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
