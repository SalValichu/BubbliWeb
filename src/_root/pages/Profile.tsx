import {
  Route,
  Routes,
  Link,
  Outlet,
  useParams,
  useLocation,
} from "react-router-dom";
import { Button } from "@/components/ui";
import { LikedPosts } from "@/_root/pages";
import { useUserContext } from "@/context/AuthContext";
import { useGetUserById } from "@/lib/react-query/queries";
import { GridPostList, Loader } from "@/components/shared";
import { followUser , unfollowUser  } from "@/lib/appwrite/api"; // Import follow/unfollow functions
import { useEffect, useState } from "react";
import { databases, appwriteConfig } from "@/lib/appwrite/config"; // Import Appwrite config
import { Query } from "appwrite"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const FOLLOWERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FOLLOWERS_COLLECTION_ID;

interface StabBlockProps {
  value: string | number;
  label: string;
}

const StatBlock = ({ value, label }: StabBlockProps) => (
  <div className="flex-center gap-2">
    <p className="small-semibold lg:body-bold text-primary-500">{value}</p>
    <p className="small-medium lg:base-medium text-light-2">{label}</p>
  </div>
);

const Profile = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const { pathname } = useLocation();

  const { data: currentUser  } = useGetUserById(id || "");
  const [isFollowing, setIsFollowing] = useState(false); // State to track follow status
  const [followersCount, setFollowersCount] = useState(0);

  // Fetch followers count
  useEffect(() => {
    const fetchFollowersData = async () => {
      if (!id) return;
  
      try {
        // Fetch followers count
        const followersResult = await databases.listDocuments(
          appwriteConfig.databaseId, // Use appwriteConfig.databaseId
          import.meta.env.VITE_APPWRITE_FOLLOWERS_COLLECTION_ID, // Use environment variable
          [Query.equal("followedId", id)] // Correct query for followers count
        );
        setFollowersCount(followersResult.total); // Update followers count
  
        // Check if the current user is following the profile user
        if (user.id) {
          const followStatusResult = await databases.listDocuments(
            appwriteConfig.databaseId,
            import.meta.env.VITE_APPWRITE_FOLLOWERS_COLLECTION_ID, // Use environment variable
            [Query.equal("followerId", user.id), Query.equal("followedId", id)] // Correct query for follow status
          );
          setIsFollowing(followStatusResult.total > 0); // Update follow status
        }
      } catch (error) {
        console.error("Error fetching followers data:", error);
      }
    };
  
    fetchFollowersData();
  }, [id, user.id]);

  // Check if the current user is following the profile user
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user.id || !id) return;

      try {
        const result = await databases.listDocuments(
          appwriteConfig.databaseId,
          "followers",
          [Query.equal("followerId", user.id), Query.equal("followedId", id)]
        );
        setIsFollowing(result.total > 0); // Update follow status
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };

    checkFollowStatus();
  }, [user.id, id]);

  // Handle follow/unfollow action
  const handleFollow = async () => {
    if (!user.id || !id) return;

    if (user.id === id) {
      console.log("Cannot follow yourself");
      return;
    }

    try {
      if (isFollowing) {
        await unfollowUser  (user.id, id); // Unfollow the user
        setFollowersCount((prev) => prev - 1); // Decrease followers count
      } else {
        await followUser  (user.id, id); // Follow the user
        setFollowersCount((prev) => prev + 1); // Increase followers count
      }
      setIsFollowing(!isFollowing); // Toggle follow status
    } catch (error) {
      console.error("Error handling follow/unfollow:", error);
    }
  };

  if (!currentUser )
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

    return (
      <div className="profile-container">
        <div className="profile-inner_container">
          <div className="flex xl:flex-row flex-col max-xl:items-center flex-1 gap-7">
            <img
              src={
                currentUser .imageUrl || "/assets/icons/profile-placeholder.svg"
              }
              alt="profile"
              className="w-28 h-28 lg:h-36 lg:w-36 rounded-full"
            />
            <div className="flex flex-col flex-1 justify-between md:mt-2">
              <div className="flex flex-col w-full">
                <h1 className="text-center xl:text-left h3-bold md:h1-semibold w-full">
                  {currentUser .name}
                </h1>
                <p className="small-regular md:body-medium text-light-3 text-center xl:text-left">
                  @{currentUser .username}
                </p>
              </div>
  
              <div className="flex gap-8 mt-10 items-center justify-center xl:justify-start flex-wrap z-20">
                <StatBlock value={currentUser .posts.length} label="Posts" />
                <StatBlock value={followersCount} label="Followers" /> {/* Updated followers count */}
                <StatBlock value={0} label="Following" />
              </div>
  
              <p className="small-medium md:base-medium text-center xl:text-left mt-7 max-w-screen-sm">
                {currentUser .bio}
              </p>
            </div>
  
            <div className="flex justify-center gap-4">
              <div className={`${user.id !== currentUser .$id && "hidden"}`}>
                <Link
                  to={`/update-profile/${currentUser .$id}`}
                  className={`h-12 bg-dark-4 px-5 text-light-1 flex-center gap-2 rounded-lg ${
                    user.id !== currentUser .$id && "hidden"
                  }`}>
                  <img
                    src={"/assets/icons/edit.svg"}
                    alt="edit"
                    width={20}
                    height={20}
                  />
                  <p className="flex whitespace-nowrap small-medium">
                    Edit Profile
                  </p>
                </Link>
              </div>
              <div className={`${user.id === id && "hidden"}`}>
                <Button
                  type="button"
                  className={`shad-button_primary px-8 ${
                    isFollowing ? "bg-dark-3" : ""
                  }`}
                  onClick={handleFollow}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
              </div>
            </div>
          </div>
        </div>
  
        {currentUser .$id === user.id && (
          <div className="flex max-w-5xl w-full">
            <Link
              to={`/profile/${id}`}
              className={`profile-tab rounded-l-lg ${
                pathname === `/profile/${id}` && "!bg-dark-3"
              }`}>
              <img
                src={"/assets/icons/posts.svg"}
                alt="posts"
                width={20}
                height={20}
              />
              Posts
            </Link>
            <Link
              to={`/profile/${id}/liked-posts`}
              className={`profile-tab rounded-r-lg ${
                pathname === `/profile/${id}/liked-posts` && "!bg-dark-3"
              }`}>
              <img
                src={"/assets/icons/like.svg"}
                alt="like"
                width={20}
                height={20}
              />
              Liked Posts
            </Link>
          </div>
        )}
  
        <Routes>
          <Route
            index
            element={<GridPostList posts={currentUser .posts} showUser ={false} />}
          />
          {currentUser .$id === user.id && (
            <Route path="/liked-posts" element={<LikedPosts />} />
          )}
        </Routes>
        <Outlet />
      </div>
    );
  };
  
  export default Profile;