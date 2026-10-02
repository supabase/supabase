import { Seeder } from '@internal/testing/seeder'
import { Bucket, Obj } from '@storage/schemas'

export class ObjectSeeder extends Seeder {
  private bucket: Bucket

  constructor(persistence: Seeder['persistence'], bucket: Bucket) {
    super(persistence)
    this.bucket = bucket
  }

  /**
   * Creates a specified number of objects for the associated bucket.
   * @param count - Number of objects to create.
   * @param generator - Function to generate object data.
   * @returns An array of created objects.
   */
  async createObjects(
    count: number,
    generator: (n: number) => Omit<Obj, 'id' | 'bucket_id'>
  ): Promise<Obj[]> {
    const objects: Obj[] = this.generateRecords<Obj>(count, (n) => ({
      ...generator(n),
      bucket_id: this.bucket.id,
    }))
    this.addRecords<Obj>('objects', objects)
    return objects
  }
}
