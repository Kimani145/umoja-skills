from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationListSerializer, ConversationDetailSerializer, MessageSerializer
import os

# Redis client — graceful fallback if Redis not available
try:
    import redis as _redis
    _redis_client = _redis.from_url(os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
                                    socket_connect_timeout=1, socket_timeout=1)
    _redis_client.ping()
except Exception:
    _redis_client = None


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationListSerializer

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def get_or_create(self, request):
        participant_id = request.data.get('participant_id')
        
        if not participant_id:
            return Response({'error': 'participant_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from users.models import User
        try:
            participant = User.objects.get(id=participant_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(participants=participant).first()
        
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, participant)
        
        serializer = self.get_serializer(conversation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        conversation.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        return Response({'status': 'marked as read'})


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs.get('conversation_id')
        return Message.objects.filter(conversation_id=conversation_id)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        from django.utils import timezone
        conversation_id = self.kwargs.get('conversation_id')
        message = serializer.save(
            sender=self.request.user,
            conversation_id=conversation_id,
        )
        # Bubble conversation to top of list
        Conversation.objects.filter(pk=conversation_id).update(updated_at=timezone.now())


class TypingView(APIView):
    """Sets a short-lived Redis key indicating the user is typing."""
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        if _redis_client:
            key = f"typing:{conversation_id}:{request.user.id}"
            _redis_client.setex(key, 4, request.user.first_name)
        return Response({'ok': True})
