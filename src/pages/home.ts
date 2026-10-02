import { composePage } from "../lib/page";
import { navbar, navActiveLink } from "../modules/layout/navbar";
import { footer } from "../modules/layout/footer";
import { widgets } from "../modules/layout/widgets";
import { base, responsive, effects, components } from "../modules/shared";
import { hero } from "../modules/home/hero";
import { logoStrip } from "../modules/home/logo-strip";
import { services } from "../modules/home/services";
import { why } from "../modules/home/why";
import { metrics } from "../modules/home/metrics";
import { industries } from "../modules/home/industries";
import { engagement } from "../modules/home/engagement";
import { caseStudies } from "../modules/home/case-studies";
import { fde } from "../modules/home/fde";
import { insights } from "../modules/home/insights";
import { cta } from "../modules/home/cta";
import { careersTeaser } from "../modules/careers/teaser";
import { contact } from "../modules/contact";

/** Home page = these modules, top to bottom. Reorder or drop a line to change the page. */
export const homePage = composePage([
  base,
  navbar(),
  hero,
  navActiveLink,
  effects,
  components,
  logoStrip,
  services,
  why,
  metrics,
  industries,
  engagement,
  caseStudies,
  fde,
  insights,
  careersTeaser,
  cta,
  contact,
  footer(),
  widgets,
  responsive,
]);
