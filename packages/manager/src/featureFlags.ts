import { TPAProvider } from '@linode/api-v4/lib/profile';
// These flags should correspond with active features flags in LD

interface TaxBanner {
  tax_name: string;
  date: string;
  linode_tax_id?: string;
}

type OneClickApp = Record<string, string>;

interface Changelog {
  version: string;
  message: string;
}

export interface Flags {
  promos: boolean;
  vatBanner: TaxBanner;
  taxBanner: TaxBanner;
  lkeHideButtons: boolean;
  firewalls: boolean;
  oneClickApps: OneClickApp;
  promotionalOffers: PromotionalOffer[];
  mainContentBanner: MainContentBanner;
  changelog: Changelog;
  vlans: boolean;
  cvvRequired: boolean;
  databases: boolean;
  firewallBetaNotification: boolean;
  entityTransfers: boolean;
  bareMetal: boolean;
  tpaProviders: Provider[];
  machineImages: boolean;
  additionalPaymentMethods: AdditionalPaymentMethod[];
  imagesPricingBanner: ImagesPricingBanner;
  imagesPricingCopy: ImagesPricingCopy;
  referralBannerText: ReferralBannerText;
  blockStorageAvailability: boolean;
  imagesPriceInfo: boolean;
  productInformationBanners: ProductInformationBannerFlag[];
  apiMaintenance: APIMaintenance;
}

type PromotionalOfferFeature =
  | 'Linodes'
  | 'Volumes'
  | 'NodeBalancers'
  | 'Object Storage'
  | 'Kubernetes';

interface PromotionalOfferButton {
  text: string;
  href: string;
  type: 'primary' | 'secondary';
}

export interface PromotionalOffer {
  name: string;
  body: string;
  footnote: string;
  logo: string;
  alt: string;
  features: PromotionalOfferFeature[];
  displayOnDashboard: boolean;
  buttons: PromotionalOfferButton[];
}

/**
 * If the LD client hasn't been initialized, `flags`
 * (from withFeatureFlagConsumer or useFlags) will be an empty object.
 */
export type FlagSet = Partial<Flags>;

export interface MainContentBanner {
  link: {
    text: string;
    url: string;
  };
  text: string;
  key: string;
}

export interface Provider {
  name: TPAProvider;
  displayName: string;
  icon: any;
  href: string;
}

export type AdditionalPaymentMethod = 'google_pay';

export interface ImagesPricingBanner {
  key: string;
  lede: string;
  link: {
    text: string;
    url: string;
  };
  text: string;
}

export interface ImagesPricingCopy {
  captureImage: string;
  uploadImage: string;
}

interface ReferralBannerText {
  text: string;
  link?: {
    text: string;
    url: string;
  };
}

export type ProductInformationBannerLocation = 'Object Storage';

export interface ProductInformationBannerFlag {
  // `key` should be unique across product information banners
  key: string;
  // `message` is rendered as Markdown (to support links)
  message: string;
  // `bannerLocation` is the location where the banner will be rendered
  bannerLocation: ProductInformationBannerLocation;
  // The date where the banner should no longer be displayed.
  expirationDate: string;
}

export interface SuppliedMaintenanceData {
  id: string;
  title?: string;
  body?: string;
}
export interface APIMaintenance {
  maintenances: SuppliedMaintenanceData[];
}
