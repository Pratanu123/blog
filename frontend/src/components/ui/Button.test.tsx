import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders a labeled button", () => {
    render(<Button>Publish</Button>);
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
  });
});
