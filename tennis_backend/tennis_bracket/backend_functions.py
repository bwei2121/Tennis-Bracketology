from tennis_bracket.models import MatchData, PlayerData, SeedingData

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

# Get user created bracket that is stored in database
# Parameter bracket: BracketData object representing tournament bracket
# Parameter parsedTournament: parsed version of tournament title
# Returns data related to tournament bracket
def getStoredBracket(bracket, parsedTournament):
  matchSet=MatchData.objects.filter(matches=bracket)
  rosterSet=SeedingData.objects.filter(roster=bracket)
  rosterValues=rosterSet.values("playerId", "playerName")
  rosterList=list(rosterValues)
  tournamentMatches=[]
  for match in matchSet:
    matchData={
      "id1": None,
      "id2": None,
      "opponent1": None,
      "opponent2": None
    }
    player1=match.player1
    player2=match.player2
    removePlaceholder=detectDifferenceInScores(player1, player2)
    setPlayerMatchData(player1, matchData, 1, removePlaceholder)
    setPlayerMatchData(player2, matchData, 2, removePlaceholder)
    tournamentMatches.append(matchData)
  data={"title": parsedTournament, "roster": rosterList, "results": tournamentMatches, "method": "database"}
  return data

# Sets player data in a match, used for retriving user created bracket from database
# Parameter player: player data in the match
# Parameter matchData: match data related to player
# Parameter playerNumber: 1 or 2, which is either player 1 or player 2 in the match respectively
# Parameter removePlaceholder: boolean that tells if the first digit placeholder should be removed from a winning score
# Returns void: match data is updated
def setPlayerMatchData(player, matchData, playerNumber, removePlaceholder):
  if(player!=None):
    matchData[f'id{playerNumber}']=player.playerId
    if(player.result=="win" and player.score!=None and removePlaceholder):
      scoreString=str(player.score)
      # remove the first digit (used as a placeholder) for winning scores
      matchData[f'opponent{playerNumber}']={"score": int(scoreString[1:len(scoreString)]), "result": player.result}
    else:
      matchData[f'opponent{playerNumber}']={"score": player.score, "result": player.result}

# Detect if winning score has a placeholder by checking difference in length of scores between player 1 and player 2
# Parameter player1: player 1 data
# Parameter player2: player 2 data
# Returns boolean: true if there is difference in player score lengths, false otherwise
def detectDifferenceInScores(player1, player2):
  if(player1!=None and player2!=None):
    score1=player1.score
    score2=player2.score
    scoreString1=str(score1)
    scoreString2=str(score2)
    return len(scoreString1)!=len(scoreString2)
  return False

# Gets the amount of predictions right by user, only considers matches that have already happened
# Parameter predictedResults: user predicted tournament reults
# Parameter actualResults: actual tournament results
# Returns dictionary containing user prediction rate
def getPredictionRate(predictedResults, actualResults):
  correctPredictions=0
  totalPredictions=0
  for predictedMatch in predictedResults:
    id1=predictedMatch["id1"]
    id2=predictedMatch["id2"]
    opponent1=predictedMatch["opponent1"]
    opponent2=predictedMatch["opponent2"]
    if(id1 and id2 and opponent1 and opponent2):
      opponent1Result=opponent1["result"]
      opponent2Result=opponent2["result"]
      if(opponent1Result or opponent2Result):
        for actualMatch in actualResults:
          id1Actual=actualMatch["id1"]
          id2Actual=actualMatch["id2"]
          if(id1==id1Actual and id2==id2Actual):
            opponent1Actual=actualMatch["opponent1"]
            opponent2Actual=actualMatch["opponent2"]
            # winner only will contain "result" key in opponent1Actual or opponent2Actual objects
            if(("result" in opponent1Actual and opponent1Result=="win") or ("result" in opponent2Actual and opponent2Result=="win")):
              correctPredictions+=1
            totalPredictions+=1
            break
          elif(id1==id2Actual and id2==id1Actual):
            opponent1Actual=actualMatch["opponent1"]
            opponent2Actual=actualMatch["opponent2"]
            # winner only will contain "result" key in opponent1Actual or opponent2Actual objects
            if(("result" in opponent1Actual and opponent2Result=="win") or ("result" in opponent2Actual and opponent1Result=="win")):
              correctPredictions+=1
            totalPredictions+=1
            break
  predictionRate={"correctPredictions": correctPredictions, "totalPredictions": totalPredictions}
  return {"predictionRate": predictionRate}