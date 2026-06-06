from rest_framework import serializers
from .models import Conversation, Message
from users.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'conversation', 'sender', 'body', 'is_read', 'created_at')
        read_only_fields = ('id', 'conversation', 'sender', 'is_read', 'created_at')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['sender'] = request.user
        return super().create(validated_data)


class ConversationListSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ('id', 'participants', 'last_message', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_last_message(self, obj):
        message = obj.messages.first()
        if message:
            return MessageSerializer(message).data
        return None


class ConversationDetailSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ('id', 'participants', 'messages', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
