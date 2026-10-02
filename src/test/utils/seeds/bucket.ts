// src/seeders/BucketsSeeder.ts

import { Seeder } from '@internal/testing/seeder'
import { Bucket, Obj } from '@storage/schemas'
import { ObjectSeeder } from './object'

export class BucketsSeeder extends Seeder {
  /**
   * Creates a specified number of buckets.
   * @param count - Number of buckets to create.
   * @param generator - Function to generate bucket data.
   * @returns An array of created buckets.
   */
  async createBuckets(count: number, generator: (n: number) => Bucket): Promise<Bucket[]> {
    const buckets: Bucket[] = this.generateRecords<Bucket>(count, generator)
    this.addRecords<Bucket>('buckets', buckets)
    return buckets
  }

  /**
   * Creates objects associated with a given bucket.
   * @param bucket - The parent bucket.
   * @param count - Number of objects to create.
   * @param generator - Function to generate object data.
   * @returns An array of created objects.
   */
  async createObjects(
    bucket: Bucket,
    count: number,
    generator: (n: number) => Omit<Obj, 'bucket_id'>
  ): Promise<Obj[]> {
    const objects: Obj[] = this.generateRecords<Obj>(count, (n) => ({
      ...generator(n),
      bucket_id: bucket.id,
    }))
    this.addRecords<Obj>('objects', objects)
    return objects
  }

  /**
   * Asynchronously iterates over a list of buckets and executes a callback for each.
   * The callback receives an object containing child seeders.
   * @param buckets - The list of buckets to iterate over.
   * @param callback - The asynchronous callback to execute for each bucket.
   */
  async each(
    buckets: Bucket[],
    callback: (context: { bucket: Bucket; objectSeeder: ObjectSeeder }) => Promise<void>
  ): Promise<void> {
    for (const bucket of buckets) {
      const objectSeeder = new ObjectSeeder(this.persistence, bucket)
      await callback({ bucket, objectSeeder })
    }
  }
}
