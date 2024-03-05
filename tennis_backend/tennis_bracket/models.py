from django.db import models

# represents player data of a player in a match
class PlayerData(models.Model):
  playerId=models.IntegerField(blank=True, null=True)
  score=models.IntegerField(blank=True, null=True)
  result=models.CharField(max_length=256, blank=True, null=True)

# represents bracket data for a tournament with 'title' name
class BracketData(models.Model):
  title=models.CharField(max_length=256)

# represents list of players in the bracket
class SeedingData(models.Model):
  seedId=models.IntegerField()
  playerId=models.IntegerField(blank=True, null=True)
  playerName=models.CharField(max_length=256, blank=True, null=True)
  roster=models.ForeignKey(BracketData, on_delete=models.CASCADE)

# represents match data in a bracket
class MatchData(models.Model):
  player1=models.OneToOneField(PlayerData, on_delete=models.CASCADE, related_name='player1', blank=True, null=True)
  player2=models.OneToOneField(PlayerData, on_delete=models.CASCADE, related_name='player2', blank=True, null=True)
  matchId=models.IntegerField()
  matches=models.ForeignKey(BracketData, on_delete=models.CASCADE)