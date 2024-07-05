// This methods are a dirty hack to support v2 collections
import { PropertiesArray } from "src/unique_types";

export const convertPropertiesV2ToV1 = (properties: PropertiesArray): PropertiesArray => {

  const patched = properties.map(p => {
    if (p.key === 'schemaName') p.value = '"unique"'
    else if (p.key === 'schemaVersion') p.value = '"1.0.0"'
    return p
  });

  const collectionInfo = properties.find(p => p.key === 'collectionInfo');
  if (collectionInfo) {
    const collectionInfoObj = JSON.parse(collectionInfo.value);
    const coverImage = collectionInfoObj.cover_image;
    if (coverImage) patched.push({key: 'coverPicture.url', value: `"${coverImage.url}"`});
    
    const potentialAttributes = collectionInfoObj.potential_attributes;
    if(potentialAttributes) {
      for (const [i, attr] of (potentialAttributes as any[]).entries()) {
        patched.push({key: `attributesSchema.${i}`, value: JSON.stringify({
          type: "string",
          name: {_: attr.trait_type}
        })})
      }
    }
  }

  patched.push({key: 'attributesSchemaVersion', value: '"1.0.0"'});
  patched.push({key: 'originalSchemaVersion', value: '"2.0.0"'});
  patched.push({key: 'image.urlTemplate', value: '"{infix}"'});

  return patched;
}
