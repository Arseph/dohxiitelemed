<template>
    <VideoConference :conid="conid"/>
</template>
<script setup lang="ts">
import CryptoJS from 'crypto-js';
import type { RouteParams } from 'vue-router';
import { useRoute } from 'vue-router';

const route = useRoute()
const secretKey = 'SecretKey'
const params = route.params as RouteParams
const encryptedId = params.id
const bytes = CryptoJS.AES.decrypt(encryptedId, secretKey)
const conid = bytes.toString(CryptoJS.enc.Utf8)
</script>
