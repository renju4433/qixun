import EmojiContainer from '@/components/Map/Emoji/EmojiContainer';
import { useModel } from '@@/exports';

export const ChallengeEmoji = () => {
  const { emoji, type, gameId } = useModel('Challenge.model', (model) => ({
    emoji: model.emoji,
    type: model.gameData?.type,
    gameId: model.gameData?.id,
  }));
  return <EmojiContainer emoji={emoji} gameType={type} gameId={gameId} />;
};

export const PartyEmoji = () => {
  const { emoji, partyId } = useModel('Party.model', (model) => ({
    emoji: model.emoji,
    partyId: model.partyData?.id,
  }));
  return <EmojiContainer emoji={emoji} partyId={partyId} />;
};
