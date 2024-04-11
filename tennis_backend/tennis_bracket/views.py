import json
from rest_framework.views import APIView
from django.http import HttpResponse, Http404
from django.shortcuts import render
from tennis_scraper import getAllTournaments, getBracketInfo, getH2H, getPlayerRank, parsedTitle
from tennis_bracket.serializers import BracketSerializer
from tennis_bracket.models import BracketData
from tennis_bracket.backend_functions import getStoredBracket

# Create your views here.
class BracketInformation(APIView):
  # Send all matches results of bracket to frontend
  def get(self, request):
    tournament=request.GET['tournament']
    type=request.GET['type']
    parsedTournament=parsedTitle(tournament)
    if(type=="predict"):
      bracketSet=BracketData.objects.filter(title=parsedTournament)
      if(bracketSet):
        # get most updated bracket of tournament
        bracket=bracketSet.last()
        # get user created bracket data from database
        data=getStoredBracket(bracket, parsedTournament)
        return HttpResponse(json.dumps(data))
    # get bracket data from web scraping
    bracketData=getBracketInfo(f"https://www.tennisabstract.com/current/{tournament}.html")
    if(bracketData==None):
      raise Http404
    title=bracketData[0]
    roster=bracketData[1]
    results=bracketData[2]
    data={"title": title, "roster": roster, "results": results, "method": "webscrape"}
    return HttpResponse(json.dumps(data))
  
  # Save information from user created bracket
  def post(self, request):
    serializer=BracketSerializer(data=request.data)
    if serializer.is_valid(raise_exception=True):
      serializer.save()
    return HttpResponse()
  
class TournamentsData(APIView):
  # Send all tournaments that can be viewed by user from tennisabstract.com
  def get(self, request):
    allTournaments=getAllTournaments()
    data={"tournaments": allTournaments}
    return HttpResponse(json.dumps(data))
  
class PlayerData(APIView):
  # Send match information, wihch includes current ranks of both players and head to head record
  def get(self, request):
    player=request.GET['player']
    opponent=request.GET['opponent']
    opponentParsed=request.GET['opponentParsed']
    (h2hData, tourType)=getH2H(player, opponent, opponentParsed)
    playerRank=getPlayerRank(player)
    opponentRank=getPlayerRank(opponentParsed)
    playerData={"h2hData": h2hData, "playerRank": playerRank, "opponentRank": opponentRank, "tourType": tourType}
    return HttpResponse(json.dumps(playerData))