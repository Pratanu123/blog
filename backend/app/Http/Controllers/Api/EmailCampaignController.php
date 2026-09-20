<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EmailCampaignResource;
use App\Http\Resources\EmailTemplateResource;
use App\Http\Resources\NewsletterSubscriberResource;
use App\Models\EmailCampaign;
use App\Models\EmailTemplate;
use App\Services\EmailCampaignService;
use App\Services\EmailTemplateService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class EmailCampaignController extends Controller
{
    public function __construct(
        private readonly EmailCampaignService $campaigns,
        private readonly EmailTemplateService $templates,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', EmailCampaign::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $paginator = $this->campaigns->paginate($filters);

        return ApiResponse::success([
            'items' => EmailCampaignResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Campaigns retrieved');
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('manage', EmailCampaign::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'email_template_id' => ['required', 'integer', 'exists:email_templates,id'],
            'subscriber_ids' => ['nullable', 'array'],
            'subscriber_ids.*' => ['integer', 'exists:newsletter_subscribers,id'],
            'emails' => ['nullable', 'array'],
            'emails.*' => ['email', 'max:180'],
            'scheduled_at' => ['nullable', 'date', 'after:now'],
        ]);

        if (empty($data['subscriber_ids']) && empty($data['emails'])) {
            return ApiResponse::error('Select subscribers or add at least one email address.', 422);
        }

        $campaign = $this->campaigns->create($data, $request->user());
        $message = $campaign->status === 'scheduled' ? 'Campaign scheduled' : 'Campaign processed';

        return ApiResponse::success(new EmailCampaignResource($campaign), $message, 201);
    }

    public function resendFailed(EmailCampaign $emailCampaign): JsonResponse
    {
        $this->authorize('manage', EmailCampaign::class);
        $campaign = $this->campaigns->resendFailed($emailCampaign->load(['template', 'recipients']));

        return ApiResponse::success(new EmailCampaignResource($campaign), 'Failed emails resent');
    }

    public function resendRecipient(EmailCampaign $emailCampaign, int $recipient): JsonResponse
    {
        $this->authorize('manage', EmailCampaign::class);
        $model = $emailCampaign->recipients()->whereKey($recipient)->firstOrFail();
        $campaign = $this->campaigns->resendRecipient($model);

        return ApiResponse::success(new EmailCampaignResource($campaign), 'Email resent');
    }

    public function show(EmailCampaign $emailCampaign): JsonResponse
    {
        $this->authorize('viewAny', EmailCampaign::class);
        $emailCampaign->load(['template', 'creator', 'recipients']);

        return ApiResponse::success(new EmailCampaignResource($emailCampaign), 'Campaign retrieved');
    }

    public function templates(): JsonResponse
    {
        $this->authorize('viewAny', EmailCampaign::class);

        return ApiResponse::success(
            EmailTemplateResource::collection($this->templates->all()),
            'Templates retrieved'
        );
    }

    public function storeTemplate(Request $request): JsonResponse
    {
        $this->authorize('manage', EmailCampaign::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:80'],
            'subject' => ['required', 'string', 'max:255'],
            'html_body' => ['required', 'string'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $template = $this->templates->create($data);

        return ApiResponse::success(new EmailTemplateResource($template), 'Template created', 201);
    }

    public function updateTemplate(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $this->authorize('manage', EmailCampaign::class);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:80'],
            'subject' => ['sometimes', 'required', 'string', 'max:255'],
            'html_body' => ['sometimes', 'required', 'string'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $template = $this->templates->update($emailTemplate, $data);

        return ApiResponse::success(new EmailTemplateResource($template), 'Template updated');
    }

    public function destroyTemplate(EmailTemplate $emailTemplate): JsonResponse
    {
        $this->authorize('manage', EmailCampaign::class);

        try {
            $this->templates->delete($emailTemplate);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(null, 'Template deleted');
    }

    public function previewTemplate(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $this->authorize('viewAny', EmailCampaign::class);

        $data = $request->validate([
            'email' => ['nullable', 'email', 'max:180'],
        ]);

        $preview = $this->templates->preview($emailTemplate, [
            'email' => $data['email'] ?? 'reader@example.com',
        ]);

        return ApiResponse::success($preview, 'Preview rendered');
    }

    public function subscribers(Request $request): JsonResponse
    {
        $this->authorize('viewAny', EmailCampaign::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'in:active,unsubscribed,all'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:500'],
        ]);

        $paginator = $this->campaigns->subscribers($filters);

        return ApiResponse::success([
            'items' => NewsletterSubscriberResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ], 'Subscribers retrieved');
    }
}
