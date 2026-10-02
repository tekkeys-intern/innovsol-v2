import { composePage } from "../lib/page";
import { navbar } from "../modules/layout/navbar";
import { footer } from "../modules/layout/footer";
import { base, responsive, components } from "../modules/shared";
import { careersHero } from "../modules/careers/hero";
import { careersFdeWay } from "../modules/careers/fde-way";
import { careersWhy } from "../modules/careers/why";
import { careersOpenRoles } from "../modules/careers/open-roles";
import { careersApplyCta } from "../modules/careers/apply-cta";
import { careersResponsive } from "../modules/careers/responsive";

const nav = navbar("/");
const foot = footer("/");

/** Careers page. Anchors in the shared navbar/footer point back to the home page ("/#…"). */
export const careersPage = composePage(
  [
    components,
    nav,
    careersHero,
    careersFdeWay,
    careersWhy,
    careersOpenRoles,
    careersApplyCta,
    foot,
  ],
  // Shared styles first, then page-specific ones (keeps the original cascade order)
  {
    css: [
      base,
      components,
      nav,
      foot,
      responsive,
      careersHero,
      careersFdeWay,
      careersWhy,
      careersOpenRoles,
      careersApplyCta,
      careersResponsive,
    ],
  },
);
