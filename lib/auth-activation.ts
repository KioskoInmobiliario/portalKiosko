export function activationFromHash(hash: string) {
 const params = new URLSearchParams(hash.replace(/^#/,''));
 const type = params.get('type');
 if (params.get('error') || !['invite','recovery'].includes(type || '') || !params.get('access_token')) {
  return { token: '', error: 'El enlace no es válido o venció. Solicite una nueva invitación.' };
 }
 return { token: params.get('access_token')!, error: '' };
}
export function passwordError(password: string, confirmation: string) {
 if (password.length < 12) return 'Use una contraseña de al menos 12 caracteres.';
 if (password !== confirmation) return 'Las contraseñas no coinciden.';
 return '';
}
