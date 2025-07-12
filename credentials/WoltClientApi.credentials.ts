import { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class WoltClientApi implements ICredentialType {
	name = 'woltApi';
	displayName = 'Wolt API';
	documentationUrl = 'https://developer.wolt.com/docs/api/venue';
	icon: Icon | undefined = 'file:wolt.svg';
	properties: INodeProperties[] = [
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			placeholder: 'username',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			placeholder: 'password',
		},
		{
			displayName: 'WOLT-API-KEY',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			placeholder: 'WOLT-API-KEY',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Production',
					value: 'production',
				},
				{
					name: 'Test',
					value: 'test',
				},
			],
			default: 'test',
			description: 'Select the environment to use',
			required: true,
		},
	];
}
