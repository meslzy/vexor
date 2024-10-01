import { type HomeLayoutProps } from "fumadocs-ui/home-layout";

export const baseOptions: HomeLayoutProps = {
  nav: {
    title: "Vexor",
  },
  links: [
    {
      text: "Documentation",
      url: "/docs",
      active: "nested-url",
    },
  ],
};
