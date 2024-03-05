from tennis_bracket.models import PlayerData

# Creates PlayerData object that stores an individual player data from a tennis match
# Parameter player: player data containing player id, score, and result
# Returns PlayerData object containing player data
def createPlayerDataObject(player):
  score=None
  result=None
  if('score' in player):
    score=player['score']
  if('result' in player):
    result=player['result']
  return PlayerData.objects.create(playerId=player['playerId'], score=score, result=result)