import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./components/HomePage";
import { SwipePage } from "./components/SwipePage";
import { MessagesPage } from "./components/MessagesPage";
import { ProfilePage } from "./components/ProfilePage";
import { AppIconShowcase } from "./components/AppIconShowcase";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "swipe", Component: SwipePage },
      { path: "messages", Component: MessagesPage },
      { path: "profile", Component: ProfilePage },
    ],
  },
  {
    path: "/icon",
    Component: AppIconShowcase,
  },
]);