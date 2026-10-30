import { CheckCircle } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { RatingDisplay } from '../ui/StarRating';
import { formatTimeAgo } from '../../utils/formatters';

const ReviewCard = ({ review }) => {
  const { reviewer, rating, comment, title, createdAt, isVerified, subRatings, landlordResponse } = review;

  return (
    <div className="bg-surface-card border border-surface-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar src={reviewer?.avatar?.url} firstName={reviewer?.firstName} lastName={reviewer?.lastName} size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-white">{reviewer?.firstName} {reviewer?.lastName}</p>
              {isVerified && <CheckCircle size={12} className="text-green-400" />}
            </div>
            <p className="text-xs text-gray-400">{formatTimeAgo(createdAt)}</p>
          </div>
        </div>
        <RatingDisplay value={rating} size="sm" />
      </div>

      {title && <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>}
      <p className="text-sm text-gray-300 leading-relaxed mb-3">{comment}</p>

      {subRatings && Object.values(subRatings).some((v) => v > 0) && (
        <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-surface-light rounded-xl">
          {Object.entries(subRatings).filter(([, v]) => v > 0).map(([key, val]) => (
            <div key={key} className="text-center">
              <p className="text-xs text-gray-400 capitalize mb-0.5">{key}</p>
              <span className="text-yellow-400 text-xs font-bold">{val} ★</span>
            </div>
          ))}
        </div>
      )}

      {landlordResponse?.response && (
        <div className="mt-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <p className="text-xs font-semibold text-yellow-400 mb-1">Response from landlord</p>
          <p className="text-xs text-gray-300">{landlordResponse.response}</p>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
