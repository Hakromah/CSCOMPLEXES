import type { Schema, Struct } from '@strapi/strapi';

export interface SharedBenefit extends Struct.ComponentSchema {
  collectionName: 'components_shared_benefits';
  info: {
    displayName: 'List Item';
  };
  attributes: {
    text: Schema.Attribute.Text;
  };
}

export interface SharedDetails extends Struct.ComponentSchema {
  collectionName: 'components_shared_details';
  info: {
    displayName: 'details';
  };
  attributes: {
    details: Schema.Attribute.JSON;
  };
}

export interface SharedEmails extends Struct.ComponentSchema {
  collectionName: 'components_shared_emails';
  info: {
    displayName: 'emails';
  };
  attributes: {
    address: Schema.Attribute.Email;
  };
}

export interface SharedFeatureCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_feature_cards';
  info: {
    description: '';
    displayName: 'Feature Card';
    icon: 'layout';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.Enumeration<
      ['BookOpen', 'HandHeart', 'Home', 'Star', 'Shield', 'GraduationCap']
    >;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedFooterLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_footer_links';
  info: {
    description: '';
    displayName: 'footer-link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedHeroSlide extends Struct.ComponentSchema {
  collectionName: 'components_shared_hero_slides';
  info: {
    displayName: 'hero-slide';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedLinkItems extends Struct.ComponentSchema {
  collectionName: 'components_shared_link_items';
  info: {
    displayName: 'link-items';
    icon: 'link';
  };
  attributes: {
    text: Schema.Attribute.String;
    visibled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
  };
}

export interface SharedNavItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_nav_items';
  info: {
    displayName: 'nav-item';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    sub_items: Schema.Attribute.Component<'shared.nav-sub-item', true>;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedNavSubItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_nav_sub_items';
  info: {
    displayName: 'nav-sub-item';
    icon: 'bulletList';
  };
  attributes: {
    description: Schema.Attribute.Text;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedPhones extends Struct.ComponentSchema {
  collectionName: 'components_shared_phones';
  info: {
    displayName: 'phones';
  };
  attributes: {
    phones: Schema.Attribute.BigInteger;
  };
}

export interface SharedReadcrumb extends Struct.ComponentSchema {
  collectionName: 'components_shared_readcrumbs';
  info: {
    displayName: 'readcrumb';
    icon: 'crown';
  };
  attributes: {
    breadcrumb_title: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
  };
}

export interface SharedRequirement extends Struct.ComponentSchema {
  collectionName: 'components_shared_requirements';
  info: {
    displayName: 'requirement';
  };
  attributes: {
    requirements: Schema.Attribute.JSON;
  };
}

export interface SharedSocialLinks extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    displayName: 'social-links';
  };
  attributes: {
    href: Schema.Attribute.Text;
    name: Schema.Attribute.String;
  };
}

export interface SharedValues extends Struct.ComponentSchema {
  collectionName: 'components_shared_values';
  info: {
    displayName: 'values';
  };
  attributes: {
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.benefit': SharedBenefit;
      'shared.details': SharedDetails;
      'shared.emails': SharedEmails;
      'shared.feature-card': SharedFeatureCard;
      'shared.footer-link': SharedFooterLink;
      'shared.hero-slide': SharedHeroSlide;
      'shared.link-items': SharedLinkItems;
      'shared.nav-item': SharedNavItem;
      'shared.nav-sub-item': SharedNavSubItem;
      'shared.phones': SharedPhones;
      'shared.readcrumb': SharedReadcrumb;
      'shared.requirement': SharedRequirement;
      'shared.social-links': SharedSocialLinks;
      'shared.values': SharedValues;
    }
  }
}
