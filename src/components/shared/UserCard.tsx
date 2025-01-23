// UserCard.tsx
import { Models } from "appwrite";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Client, Databases, Query } from "appwrite";
import { useState, useEffect } from "react";
import { followUser     } from '@/lib/appwrite/api';
import { unfollowUser     } from '@/lib/appwrite/api';

const APPWRITE_URL = import.meta.env.VITE_APPWRITE_URL;
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const FOLLOWERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FOLLOWERS_COLLECTION_ID;

const client = new Client();
client.setEndpoint(APPWRITE_URL).setProject(APPWRITE_PROJECT_ID);
const databases = new Databases(client);

type UserCardProps = {
  user: Models.Document;
  currentUserId: string; // Logged-in user ID
};

const UserCard = ({ user, currentUserId }: UserCardProps) => {
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        const result = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [
          'followers',
          Query.equal('followerId', currentUserId),
          Query.equal('followedId', user.$id),
        ]
        );
        setIsFollowing(result.total > 0);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [currentUserId, user.$id]);

    const handleFollow = async () => {
      if (currentUserId === user.$id) {
        console.log('Cannot follow yourself');
        return;
      }

      if (isFollowing) {
        await unfollowUser     (currentUserId, user.$id);
      } else {
        await followUser     (currentUserId, user.$id);
      }

      setIsFollowing(!isFollowing);
    };


  return (
    <Link to={`/profile/${user.$id}`} className="user-card">
      <img
        src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
        alt="creator"
        className="rounded-full w-14 h-14"
      />

      <div className="flex-center flex-col gap-1">
        <p className="base-medium text-light-1 text-center line-clamp-1">{user.name}</p>
        <p className="small-regular text-light-3 text-center line-clamp-1">@{user.username}</p>
      </div>

      <Button
        type="button"
        size="sm"
        className={`shad-button_primary px-5 ${isFollowing ? 'bg-red-500' : 'bg-blue-500'}`}
        onClick={handleFollow}
      >
        {isFollowing ? 'Unfollow' : 'Follow'}
      </Button>
    </Link>
  );
};

export default UserCard;