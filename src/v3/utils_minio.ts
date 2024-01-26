import axios from 'axios'

import {sha1} from '@noble/hashes/sha1'
import {hmac} from '@noble/hashes/hmac'
import * as base64 from 'js-base64'

import {v4 as generateUUID} from 'uuid'

import {fileTypeFromBuffer} from 'file-type'
import mime from 'mime'

type IMinioConfig = {
  endPoint: string
  bucketName: string
  accessKey: string
  secretKey: string
}
const getMinioConfig = (): IMinioConfig => {
  const minioConfig = {
    endPoint: process.env.MINIO_ENDPOINT!,
    bucketName: process.env.MINIO_BUCKET_NAME!,
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  } satisfies IMinioConfig
  if (
    !minioConfig.endPoint ||
    !minioConfig.bucketName ||
    !minioConfig.accessKey ||
    !minioConfig.secretKey
  ) {
    throw new Error('Minio config is not set')
  }

  return minioConfig as IMinioConfig
}

const calculateSignature = (secretKey: string, message: string) => {
  const hmac_ = hmac(sha1, secretKey, message)
  const signature = base64.fromUint8Array(hmac_)
  return signature
}


export type FileToUpload = {
  fileData: Uint8Array
  fileName: string
  mimetype?: string
  useOriginalFileName?: boolean
}

export const uploadFile = async (file: FileToUpload) => {
  const {fileData} = file
  const fileName = file.useOriginalFileName
    ? file.fileName
    : generateUUID() + '.' + (file.fileName.split('.').pop()?.toLowerCase() || '')
  const {endPoint, bucketName, accessKey, secretKey} = getMinioConfig()

  const resource = `/${bucketName}/${fileName}`
  const contentType =
    file.mimetype ||
    (await fileTypeFromBuffer(fileData))?.mime ||
    mime.getType(fileName) ||
    'application/octet-stream'
  const dateString = new Date().toUTCString()

  const signature= calculateSignature(
    secretKey,
    `PUT\n\n${contentType}\n${dateString}\n${resource}`,
  )

  const url = `https://${endPoint}${resource}`

  await axios.put(url, fileData, {
    headers: {
      Host: endPoint,
      Date: dateString,
      'Content-Type': contentType,
      Authorization: `AWS ${accessKey}:${signature}`,
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  })
  return {
    success: true,
    fileName,
    url,
  }
}

const removeFile = async (fileUrl: string): Promise<void> => {
  const filename = fileUrl.split('/').pop()!
  const {endPoint, bucketName, accessKey, secretKey} = getMinioConfig()
  const resource = `/${bucketName}/${filename}`
  const contentType = (await axios.head(fileUrl)).headers['Content-Type'] as string || 'application/octet-stream'
  const dateString = new Date().toUTCString()
  const signature = calculateSignature(
    secretKey,
    `DELETE\n\n${contentType}\n${dateString}\n${resource}`,
  )

  await axios.delete(fileUrl, {
    headers: {
      Host: endPoint,
      Date: dateString,
      Authorization: `AWS ${accessKey}:${signature}`,
    },
  })
}


/*
const testUpload = async () => {
  // const fileName = 'hello.json'
  // const fileData = fs.readFileSync(`./schemas/${fileName}`)
  // const result = await uploadFile({fileData, fileName})
  // console.log(result)
  await removeFile('https://storage.unique.network/demo-bucket/hello.json')
}
testUpload()
  .then(() => console.log('Done!'))
  .catch(error => {
    if (axios.isAxiosError(error)) {
      const url = error.response?.request.res.responseUrl || error.config?.url
      console.error(error.response?.status, error.response?.statusText, url, error.response?.data)
    } else {
      console.error(error)
    }
  })
*/
