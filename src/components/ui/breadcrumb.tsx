import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {
  segments: {
    name: string;
    path: string;
  }[];
}

export function Breadcrumb({ segments, className, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-2 text-sm", className)}
      {...props}
    >
      <ol className="flex items-center space-x-2">
        {segments.map((segment, index) => (
          <li key={segment.path} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="mx-2 h-4 w-4 text-gray-400" aria-hidden="true" />
            )}
            <Link
              to={segment.path}
              className={cn(
                "text-sm font-medium hover:text-white transition-colors",
                index === segments.length - 1
                  ? "text-white cursor-default"
                  : "text-gray-400"
              )}
              aria-current={index === segments.length - 1 ? "page" : undefined}
            >
              {segment.name}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
} 