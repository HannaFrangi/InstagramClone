import { BsBookmark, BsGrid3X3, BsSuitHeart, BsTextParagraph } from "react-icons/bs";

export const PROFILE_TABS = [
  { value: "posts", label: "Posts", icon: <BsTextParagraph /> },
  { value: "media", label: "Media", icon: <BsGrid3X3 /> },
  // Only shown on your own profile
  { value: "saved", label: "Saved", icon: <BsBookmark />, private: true },
  { value: "liked", label: "Likes", icon: <BsSuitHeart />, private: true },
];

export const tabsFor = (isOwnProfile) =>
  PROFILE_TABS.filter((tab) => isOwnProfile || !tab.private).map((tab) => tab.value);
