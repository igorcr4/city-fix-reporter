import type { FormEvent } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PasswordInput } from "./password-input";

function getInput(): HTMLInputElement {
  return screen.getByTestId("password") as HTMLInputElement;
}

function getToggle(): HTMLButtonElement {
  return screen.getByRole("button") as HTMLButtonElement;
}

describe("PasswordInput", () => {
  it("renders as a password field by default", () => {
    render(<PasswordInput data-testid="password" />);

    expect(getInput().getAttribute("type")).toBe("password");
    expect(getToggle().getAttribute("aria-label")).toBe("Arată parola");
    expect(getToggle().getAttribute("aria-pressed")).toBe("false");
  });

  it("toggles between hidden and visible and updates the accessible state", () => {
    render(<PasswordInput data-testid="password" />);

    fireEvent.click(getToggle());
    expect(getInput().getAttribute("type")).toBe("text");
    expect(getToggle().getAttribute("aria-label")).toBe("Ascunde parola");
    expect(getToggle().getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(getToggle());
    expect(getInput().getAttribute("type")).toBe("password");
    expect(getToggle().getAttribute("aria-label")).toBe("Arată parola");
    expect(getToggle().getAttribute("aria-pressed")).toBe("false");
  });

  it("does not submit the surrounding form when the toggle is clicked", () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput data-testid="password" />
      </form>,
    );

    expect(getToggle().getAttribute("type")).toBe("button");
    fireEvent.click(getToggle());
    fireEvent.click(getToggle());

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("preserves the typed value across toggles", () => {
    render(<PasswordInput data-testid="password" />);

    fireEvent.change(getInput(), { target: { value: "secret123" } });
    fireEvent.click(getToggle());
    expect(getInput().value).toBe("secret123");

    fireEvent.click(getToggle());
    expect(getInput().value).toBe("secret123");
  });

  it("links the toggle to the input and disables it with the input", () => {
    render(<PasswordInput id="pass" data-testid="password" disabled />);

    expect(getToggle().getAttribute("aria-controls")).toBe("pass");
    expect(getToggle().disabled).toBe(true);
  });
});
