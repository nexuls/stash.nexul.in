import Link from "next/link";
import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function NavBar({
  items,
}: {
  items: {
    title: string;
    href?: string;
  }[];
}) {
  return (
    <nav
      aria-label="Breadcrumbs"
      className="mb-4 not-prose flex items-center gap-2"
    >
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
          {items.map((crumb, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <React.Fragment key={`${crumb.title}-${idx}`}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast || !crumb.href ? (
                    <BreadcrumbPage className="max-w-55 truncate text-muted-foreground font-medium">
                      {crumb.title}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link href={crumb.href} />}>
                      {crumb.title}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </nav>
  );
}
