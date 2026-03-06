import app from "./app";
import { startT48ReminderJob } from "./jobs/t48Reminder.job";
import { startTokenCleanupJob } from "./jobs/tokenCleanup.job";

const PORT = parseInt(process.env.PORT || "3333", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`readflow-api corriendo en puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
});

startTokenCleanupJob();
startT48ReminderJob();
