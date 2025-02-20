require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.esc8v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const taskCollection = client.db("TaskManagerDB").collection("task");

    //get all task for a user
    app.get("/tasks/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await taskCollection.find(query).toArray();
      res.send(result);
    });

    //delete a task
    app.delete("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });

    //update task data
    app.put("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateTask = req.body;
      const task = {
        $set: {
          title: updateTask.title,
          description: updateTask.description,
          category: updateTask.category,
        },
      };
      try {
        const result = await taskCollection.updateOne(query, task);
        res.send(result);
      } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).send({ error: "Failed to update task" });
      }
    });

    //post task for a user
    app.post("/tasks", async (req, res) => {
      const taskData = req.body;
      console.log("Received data:", taskData);
      const result = await taskCollection.insertOne(taskData);
      res.send(result);
    });
  } catch (error) {
    console.error("Connection error:", error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World! task manager server running");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
