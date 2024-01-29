
export interface FileDetails {
  format: 'string';
  width: number;
  height: number;
  bytes: number;
  type: 'image' | 'video' | 'audio';
  sha256: string;
  duration?: number
  codecs?: string[]
}

export enum AttributeDisplayTypes {
  boost_number = 'boost_number',
  boost_percentage = 'boost_percentage',
  number = 'number',
  string = 'string',
  date = 'date',
}

export interface Attribute {
  trait_type: string;
  value: any;
  display_type?: AttributeDisplayTypes
  max_value?: number
}

export interface AdditionalMedia {
  url: string;
  details?: FileDetails;
  tag: string;
  name: string;
}

export interface Royalty {
  address: string;
  percent: number;
}

export interface CarbonOffset {
  collection_id: number;
  token_id: number;
  co2_g: number;
}

export interface OpenseaNftExample {
  version: string
  name: string;
  description: string;
  image?: string;
  image_details?: FileDetails;
  preview_image_url?: string;
  preview_image_details?: FileDetails;
  use_preview_as_main_image?: boolean;
  attributes: Attribute[];
  onchain_fields: string[];
  animation_url?: string;
  animation_details?: FileDetails;
  youtube_url?: string;
  created_by?: string;
  background_color?: string;
  external_url?: string;
  additional_media: AdditionalMedia[];
  image_stacking?: {
    image_url: string;
    image_details: FileDetails;
    layer: number
    order_in_layer: number;
    offset_x: number;
    offset_y: number;
    opacity: number;
    rotation: number;
    scale: 1;
    tag: string
  },
  royalties: Royalty[];
  carbon_offsets: CarbonOffset[];
  locale: string;
}

