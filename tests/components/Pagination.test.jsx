import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Pagination from "../../src/components/Pagination";

describe("Pagination", () => {
  it("disables unavailable controls and invokes the next-page callback", () => {
    const handlePreviousPage = vi.fn();
    const handleNextPage = vi.fn();

    render(
      <Pagination
        currentPage={1}
        pageNo={1}
        loading={false}
        hasNextPage
        handlePreviousPage={handlePreviousPage}
        handleNextPage={handleNextPage}
      />
    );

    expect(screen.getByRole("navigation", { name: /movie results pagination/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(handleNextPage).toHaveBeenCalledOnce();
    expect(handlePreviousPage).not.toHaveBeenCalled();
  });
});
