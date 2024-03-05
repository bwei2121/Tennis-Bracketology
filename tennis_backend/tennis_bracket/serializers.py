from rest_framework import serializers

from tennis_bracket.models import BracketData, MatchData, PlayerData, SeedingData
from tennis_bracket.backend_functions import createPlayerDataObject

# serializer for PlayerData objects
class PlayerSerializer(serializers.ModelSerializer):
  class Meta:
    model = PlayerData
    fields = '__all__'

# serializer for MatchData objects
class MatchSerializer(serializers.ModelSerializer):
  player1=PlayerSerializer(required=False, allow_null=True)
  player2=PlayerSerializer(required=False, allow_null=True)
  class Meta:
    model = MatchData
    exclude = ('matches',)

# serializer for SeedingData objects
class SeedingSerializer(serializers.ModelSerializer):
  class Meta:
    model = SeedingData
    exclude = ('roster', 'seedId')

# serializer for BracketData objects
class BracketSerializer(serializers.ModelSerializer):
    matches=MatchSerializer(many=True)
    roster=SeedingSerializer(many=True, allow_null=True)
    class Meta:
      model = BracketData
      fields = "__all__"

    # store bracket information in database with use of models in models.py
    # Parameter validated_data: bracket data that is stored using models from models.py
    def create(self, validated_data):
      title=validated_data['title']
      matches=validated_data['matches']
      roster=validated_data['roster']
      bracketSet=BracketData.objects.filter(title=title)
      if(bracketSet): # outdated brackets
        bracketSet.delete()
      bracket=BracketData.objects.create(title=title)
      for match in matches:
        player1=match['player1']
        player2=match['player2']
        player1Object=None
        player2Object=None
        if(player1!=None):
          player1Object=createPlayerDataObject(player1)
        if(player2!=None):
          player2Object=createPlayerDataObject(player2)
        MatchData.objects.create(matches=bracket, matchId=match['matchId'], player1=player1Object, player2=player2Object)
      seedId=0
      for player in roster:
        playerId=None
        playerName=None
        if(player!=None):
          playerId=player['playerId']
          playerName=player['playerName']
        SeedingData.objects.create(seedId=seedId, playerId=playerId, playerName=playerName, roster=bracket)
        seedId+=1
      return bracket