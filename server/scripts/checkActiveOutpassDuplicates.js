const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Outpass = require('../models/Outpass')

dotenv.config()

const ACTIVE_STATUSES = ['pending', 'warden_forwarded', 'approved', 'out', 'late_return']

const main = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required')
  }

  await mongoose.connect(process.env.MONGO_URI)

  const duplicates = await Outpass.aggregate([
    { $match: { status: { $in: ACTIVE_STATUSES } } },
    {
      $group: {
        _id: '$studentId',
        count: { $sum: 1 },
        outpassIds: { $push: '$_id' },
        statuses: { $push: '$status' }
      }
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } }
  ])

  if (duplicates.length === 0) {
    console.log('No duplicate active outpasses found.')
    return
  }

  console.log(`Found ${duplicates.length} student(s) with duplicate active outpasses:`)
  duplicates.forEach(item => {
    console.log(`Student ${item._id}: ${item.count} active outpasses`)
    item.outpassIds.forEach((id, index) => {
      console.log(`  - ${id} (${item.statuses[index]})`)
    })
  })
}

main()
  .catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
