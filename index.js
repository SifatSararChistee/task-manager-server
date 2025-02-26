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
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const taskCollection = client.db("TaskManagerDB").collection("task");
    const userCollection = client.db("TaskManagerDB").collection("user");

    // API to update task order after drag & drop
    app.post("/tasks/reorder", async (req, res) => {
      try {
        const { tasks } = req.body;
        const bulkOps = tasks.map((task) => ({
          updateOne: {
            filter: { _id: new ObjectId(task._id) },
            update: { $set: { order: task.order } },
          },
        }));

        await taskCollection.bulkWrite(bulkOps);
        res.status(200).json({ message: "Task order updated successfully" });
      } catch (error) {
        console.error("Error updating task order:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    //api for updating the category after drag and drop
    app.put("/tasks/:id/category", async (req, res) => {
      try {
        const { id } = req.params;
        const { category } = req.body;

        // Update task's category in the database
        const updatedTask = await taskCollection.findByIdAndUpdate(
          id,
          { category },
          { new: true }
        );

        res.status(200).json(updatedTask);
      } catch (error) {
        res.status(500).json({ message: "Failed to update category" });
      }
    });

    //add user in the database
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    //get all task for a user
    app.get("/tasks/:email", async (req, res) => {
      const email = req.params.email;
      const query = { userEmail: email };
      const result = await taskCollection
        .find(query)
        .sort({ order: 1 })
        .toArray();
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
