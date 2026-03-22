import { Trophy } from "lucide-react";

export default function LeaderboardList({ users }: { users: any[] }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-gray-800 bg-gray-900/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="text-yellow-500" /> Top Students
        </h2>
      </div>
      <div className="divide-y divide-gray-800">
        {users.map((user, index) => (
          <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : index === 1 ? 'bg-gray-300/20 text-gray-300' : index === 2 ? 'bg-orange-700/20 text-orange-600' : 'bg-gray-800 text-gray-500'}`}>
                {index + 1}
              </div>
              <div className="flex items-center gap-3">
                {user.avatar_url && (
                  <img src={user.avatar_url} alt="avatar" className="w-10 h-10 rounded-full bg-gray-800" />
                )}
                <div>
                  <p className="font-semibold text-white">{user.username}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-yellow-500">{user.points} pts</p>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No users on the leaderboard yet.
          </div>
        )}
      </div>
    </div>
  );
}
