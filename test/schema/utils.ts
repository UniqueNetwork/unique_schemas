import {PropertiesArray} from '../../src/unique_types'
import {CrossAccountId} from '@unique-nft/utils'

export const makeRawTokenFromProperties = (owner: null | CrossAccountId, properties: PropertiesArray) => {
  return {
    toHuman() {
      return {
        owner: owner,
        properties: properties,
      }
    },
    owner: {
      toHuman() {
        return owner
      }
    },
    properties: properties.map(property => {
      return {
        key: {
          toHuman() {
            return property.key
          }
        },
        value: {
          toJSON() {
            return property.value
          }
        }
      }
    })
  }
}
