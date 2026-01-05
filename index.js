const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.port || 3000;
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.p5n6wf0.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const jobCollection = client.db("job-portal").collection("jobs");
    const applicationsCollection = client
      .db("job-portal")
      .collection("applications");

    app.get("/jobs", async (req, res) => {
      const cursor = jobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    app.post("/jobs", async (req, res) => {
      const newJob = req.body;
      const result = await jobCollection.insertOne(newJob);
      console.log(result);
      res.send(result);
    });

    app.get("/getJobsByEmailAddress", (req, res) => {
      const email = req.query.email;
      const query = { hr_email: email };
    });

    app.get("/applications", async (req, res) => {
      const email = req.query.email;
      const query = {
        applicant: email,
      };

      const result = await applicationsCollection.find(query).toArray();
      //bad way to aggregate data...

      for (const application of result) {
        const jobId = application.jobId; // নিশ্চিত করুন এখানে application.job_id বা jobId সঠিক আছে
        const jobQuery = { _id: new ObjectId(jobId) };
        const job = await jobCollection.findOne(jobQuery);

        // যদি জব খুঁজে পাওয়া যায় তবেই ডাটা সেট করবে
        if (job) {
          application.company = job.company;
          application.title = job.title;
          application.company_logo = job.company_logo;
          application.location = job.location;
        } else {
          // জব না পাওয়া গেলে ডিফল্ট কিছু দিয়ে দিতে পারেন
          application.company = "Unknown Company";
          application.title = "Position No Longer Available";
        }
      }

      res.send(result);
    });

    app.post("/application", async (req, res) => {
      const application = req.body;
      const result = await applicationsCollection.insertOne(application);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("job portal is cooking");
});

app.listen(port, () => {
  console.log(`job portal server listening on port ${port}`);
});
