import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import SearchBar from "../../src/components/SearchBar";

const CurrentLocation = () => <output>{useLocation().pathname + useLocation().search}</output>;

describe("SearchBar", () => {
  it("submits a title search to the results route", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <SearchBar />
        <CurrentLocation />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole("combobox", { name: /search movies and tv shows/i }), {
      target: { value: "The Bear" },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(screen.getByText("/search?q=The%20Bear")).toBeInTheDocument();
  });
});
