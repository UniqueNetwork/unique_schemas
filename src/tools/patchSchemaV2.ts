// This methods are a dirty hack to support v2 collections
import { UniqueCollectionSchemaDecoded } from "src/types";
import { HumanizedNftToken, PropertiesArray } from "src/unique_types";

export const tryConvertCollectionPropertiesV2ToV1 = (properties: PropertiesArray): PropertiesArray => {
  try {
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
  } catch (error) {
    return properties;
  }
}

export const tryConvertTokenPropertiesV2ToV1 = (tokenData: HumanizedNftToken, schema: UniqueCollectionSchemaDecoded): HumanizedNftToken => {
  try {
    const data = tokenData.properties.find(p => p.key === 'tokenData');
    type Prop = {key: string, value: string};
    const newProperties: Prop[] = [];
    if(data) {
      const properties = JSON.parse(data.value);
      for (const propKey in properties) {
        if(propKey === 'image') {
          newProperties.push({key: 'i.u', value: properties[propKey]})
        } else if (propKey === 'attributes') {
          const attributes = properties[propKey] as {trait_type: string, value: string}[];
          for (const attr of attributes) {
            if(schema.attributesSchema) {
              for (const key in schema.attributesSchema) {
                if (schema.attributesSchema[key].name._ === attr.trait_type) {
                  newProperties.push({ key: `a.${key}`, value: JSON.stringify({_: attr.value}) });
                }
              }
            }
          }      
        }
      }
    }
  
    return {owner: tokenData.owner, properties: newProperties};  
  } catch (error) {
    return tokenData
  }
}
